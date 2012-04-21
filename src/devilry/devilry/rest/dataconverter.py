class DataConverter(object):
    """
    Data converter interface.
    """
    @classmethod
    def toPython(cls, obj, alternative_formats=[]):
        """
        Convert ``obj`` to python.
        """
        raise NotImplementedError()

    @classmethod
    def fromPython(cls, bytestring):
        """
        Convert ``obj`` from python.
        """
        raise NotImplementedError()